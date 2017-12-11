class Message < ApplicationRecord
  before_save do
    tags = []
    if content
      content.scan(/(?:\s|^)#(\S+)/) do |tag, _|
        tags << tag
      end
    end
    meta[:tags] = tags
  end

  scope :tags, -> (*tags) {
    return all if tags.blank?
    where('meta->\'tags\' @> ?', tags.to_json)
  }
  scope :no_tags, -> (*tags) {
    return all if tags.blank?
    q = all
    tags.each do |tag|
      q = q.where.not('meta->\'tags\' @> ?', [tag].to_json)
    end
    q.or(where('meta->\'tags\' is NULL'))
  }

  scope :query, -> (query) {
    return all if query.blank?
    ts = query.scan(/(?:\s|^)([^\!]\S+)/).map {|tag, _| tag }
    q = all.tags(*ts)
    nts = query.scan(/(?:\s|^)\!(\S+)/).map {|tag, _| tag }
    q.no_tags(*nts)
  }
end
